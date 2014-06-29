#! /usr/bin/env python3

from bs4 import BeautifulSoup
import bs4
import itertools as it
import sys


extra_letters = {'W', 'A', 'K', 'U', 'V', 'Z', 'H', 'J', 'F', 'E', 'Y', 'C', 'M', 'D', 'X', 'O', 'N', 'I', 'T', 'S', 'G', 'R', 'L', 'B', 'P', 'Q'}
nums = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'}

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
    nodes = dict()
    for course in courses[:-1]:
        values = course.tbody.tr.th.string.strip().split(' - ')
        if len(values) == 5:
            values = [values[0] + ' - ' + values[1]] + values [2:]
        name = values[0]
        course_id = values[1]
        course_code = values[2]
        course_section = values[3]
        while still_going(course.next_sibling):
            course = course.next_sibling
            if course.string and 'Prerequisites:' in course.string:
                break
        prereqs = []
        if course.string and 'Prerequisites: ' in course.string:
            prereqs = sorted(get_prereq(course))
        course_code = clean_course(course_code)
        if course_code not in nodes:
            nodes[course_code] = set()
        for prereq in prereqs:
            nodes[course_code].add(prereq)
    
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

if __name__ == '__main__':
    main(sys.argv[1])
