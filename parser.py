#! /usr/bin/env python3

from bs4 import BeautifulSoup
import bs4
import itertools as it
import sys
import json

extra_letters = {}
nums = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'}
departments = {'04':'UWaterloo', '05':'UWaterloo', '20':'UWaterloo',
               '27':'UWaterloo', '36':'UWaterloo', 'AB':'Languages',
               'AF':'Arts (Interdisciplinary)', 'AN':'Anthropology',
               'AP':'UWaterloo', 'AR':'Archaeology',
               'AS':'Astronomy', 'BF':'Brantford Foundations',
               'BI':'Biology', 'BU':'Business', 'CA':'Other', 'CC':'Kriminology',
               'CH':'Chemistry', 'CL':'Classical Studies',
               'CO':'Education', 'CP':'Computer Science',
               'CQ':'Cultural Analysis', 'CS':'Communication Studies',
               'CT':'Sociology', 'CX':'UWaterloo',
               'DH':'History', 'EC':'Economics', 'ED':'Education',
               'EM':'Education', 'EN':'English', 'ES':'Environment',
               'EU':'Education', 'FR':'Languages', 'FS':'English',
               'GC':'Theology', 'GG':'Geography', 'GL':'Geography',
               'GM':'Languages', 'GR':'Classical Studies',
               'GS':'Global Studies', 'GV':'Not Applicable', 'HE':'Health',
               'HI':'History', 'HN':'Health', 'HR':'Human Rights',
               'HS':'Health', 'ID':'Contemporary', 'IP':'Not Applicable',
               'IT':'Languages', 'JN':'Journalism', 'KP':'Kinesiology',
               'KS':'Cultural Studies', 'LA':'Archaeology',
               'LL':'Languages', 'LY':'Law', 'MA':'Math', 'MB':'Business',
               'MF':'Business', 'MI':'Languages', 'ML':'Cultural Studies',
               'MS':'Business', 'MU':'Music', 'MX':'Contemporary',
               'NE':'Archaeology', 'NO':'Cultural Studies', 'OL':'Business',
               'PC':'Physics', 'PM':'UWaterloo', 'PO':'Political Science',
               'PP':'Philosophy', 'PS':'Psychology', 'RE':'Theology',
               'SC':'Science', 'SE':'Arts', 'SJ':'Contemporary',
               'SK':'Social Work', 'SL':'Social Work', 'SP':'Languages',
               'SY':'Sociology', 'TH':'Theology', 'TM':'Business',
               'WS':'Cultural Studies', 'YC':'Cultural Studies'}
faculties = {'Anthropology':'Arts',
             'Archaeology':'Arts',
             'Arts':'Arts',
             'Arts (Interdisciplinary)':'Arts',
             'Classical Studies':'Arts',
             'Communication Studies':'Arts',
             'Kriminology':'Arts',
             'Cultural Analysis':'Arts',
             'Cultural Studies':'Arts',
             'English':'Arts',
             'Environment':'Arts',
             'Geography':'Arts',
             'Global Studies':'Arts',
             'History':'Arts',
             'Languages':'Arts',
             'Law':'Arts',
             'Philosophy':'Arts',
             'Political Science':'Arts',
             'Social Work':'Arts',
             'Sociology':'Arts',
             'Contemporary':'Arts',
             'Business':'Business',
             'Economics':'Business',
             'Education':'Education',
             'Health':'Human & Social Sciences',
             'Human Rights':'Human & Social Sciences',
             'Brantford Foundations':'Liberal Arts',
             'Journalism':'Liberal Arts',
             'Music':'Music',
             'Astronomy':'Science',
             'Biology':'Science',
             'Chemistry':'Science',
             'Kinesiology':'Science',
             'Computer Science':'Science',
             'Math':'Science',
             'Physics':'Science',
             'Psychology':'Science',
             'Science':'Science',
             'Theology':'Seminary',
             'Not Applicable':'Other',
             'Other':'Other',
             'UWaterloo':'Other'}

def still_going(tag):
    if type(tag) is bs4.element.NavigableString:
        return True
    try:
        if 'This layout table is used to present the sections found' in tag['summary']:
            return False
    except KeyError:
        return True
    return True


def get_prereq(tag):
    prereq = []
    while still_going(tag.next_sibling):
        tag = tag.next_sibling
        if tag.name == 'a' and tag.string != ' ':
            prereq.append(tag.string)
    return prereq

def clean_course(raw_course):
    course_code = raw_course.strip()
    if course_code[-1] in extra_letters:
        course_code = course_code[:-1]
    elif course_code[-1] not in nums:
        print(course_code, course_code[-1])
    return course_code
    
def main(file_name):
    soup = BeautifulSoup(open(file_name), 'lxml')
    body = soup.body
    course_div = body.find_all(attrs={'class':'pagebodydiv'}, limit=1)[0]
    courses = course_div.find_all(
        attrs={'summary':
               'This layout table is used to present the sections found'})
    data = dict()
    for course in courses[:-1]:
        values = course.tbody.tr.th.string.strip().split(' - ')
        if len(values) == 5:
            values = [values[0] + ' - ' + values[1]] + values [2:]
        course_name = values[0]
        course_id = values[1]
        course_code = values[2]
        course_section = values[3]

        while still_going(course.next_sibling):
            course = course.next_sibling
            if course.string and 'Prerequisites:' in course.string:
                break

        prereqs = []
        if course.string is not None and 'Prerequisites: ' in course.string:
            prereqs = list(map(clean_course, get_prereq(course)))

        course_code = clean_course(course_code)
        department = departments[course_code[:2]]
        faculty = faculties[department]

        if faculty not in data:
            data[faculty] = {}
        if department not in data[faculty]:
            data[faculty][department] = {}
            
        nodes = data[faculty][department]
        
        if course_code not in nodes:
            nodes[course_code] = {'parents':[], 'children':[]}
        for prereq in prereqs:
            if prereq not in nodes:
                nodes[prereq] = {'parents':[], 'children':[]}
            nodes[prereq]['parents'].append(course_code)

        entry = nodes[course_code]
        entry['name'] = course_name
        entry['children'] += prereqs
    return data


def dot_output(nodes):
    out_file = open('dep.dot', 'w')
    print('digraph G {', file=out_file)
    sections = []
    for code in nodes.keys():
        dependencies = nodes[code]
        section = code.split(' ')[0]
        if section not in sections:
            sections.append(section)
        #if section != 'BU':
        #    continue
        if code[0] in nums:
            code = 'n{}'.format(code)
        node_name = code.strip().replace(' ', '_')
        deps = [str(dep.strip().replace(' ', '_')) for dep in dependencies]
        
        for dep in deps:
            child_name = dep
            print('    {} -> {};'.format(node_name, child_name), file=out_file)
        if len(deps) == 0:
            print('    {};'.format(node_name), file=out_file)
    print('}', file=out_file)
    out_file.close()
    print(sorted(sections))

def json_output(nodes):
    no_names = 0
    for key in nodes:
        if 'name' not in nodes[key]:
            no_names += 1
            #print(key)
    print(no_names)
    with open('dep.json', 'w') as out_file:
        print('dep = ', end='', file=out_file)
        print(json.dumps(nodes), file=out_file)
    
    
    

if __name__ == '__main__':
    nodes = main(sys.argv[1])
    json_output(nodes)
